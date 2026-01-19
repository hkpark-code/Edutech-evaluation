'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1rem 0',
          background: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(10px)' : 'none',
          borderBottom: isScrolled ? '1px solid var(--gray-200)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
            }}>
              📊
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--gray-900)' }}>
              에듀테크 기업 가치평가
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Link href="#features" style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.9375rem' }}>
              평가 항목
            </Link>
            <Link href="#process" style={{ color: 'var(--gray-600)', fontWeight: 500, fontSize: '0.9375rem' }}>
              평가 절차
            </Link>
            <Link href="/evaluate" className="btn btn-primary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.9375rem' }}>
              평가 시작
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-hero" style={{ paddingTop: '8rem', paddingBottom: '6rem', position: 'relative', overflow: 'hidden' }}>
        {/* Background decorations */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-200) 0%, transparent 70%)',
          opacity: 0.5,
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-200) 0%, transparent 70%)',
          opacity: 0.5,
          filter: 'blur(40px)',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div
              className="animate-fadeIn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'rgba(0, 145, 200, 0.1)',
                borderRadius: 'var(--radius-full)',
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary-600)' }}>
                🏛️ KERIS 공교육 중심 평가모형
              </span>
            </div>

            <h1
              className="animate-slideInUp"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: '1.5rem',
                color: 'var(--gray-900)',
              }}
            >
              공교육 중심
              <br />
              <span style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                에듀테크 기업 가치평가
              </span>
            </h1>

            <p
              className="animate-slideInUp"
              style={{
                fontSize: '1.25rem',
                color: 'var(--gray-600)',
                marginBottom: '1.5rem',
                lineHeight: 1.7,
                animationDelay: '0.1s',
              }}
            >
              공교육 환경에 적합한 에듀테크 기업의 가치를 체계적으로 평가하고,
              <br />
              교육 현장 도입을 위한 객관적인 기준을 제시합니다.
            </p>

            {/* 안내 문구 */}
            <div
              className="animate-slideInUp"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '2rem',
                animationDelay: '0.15s',
              }}
            >
              <span style={{ fontSize: '1rem' }}>ℹ️</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--gray-700)', fontWeight: 500 }}>
                본 자가진단 결과는 1회용 진단으로 응답하신 데이터와 진단 결과는 누적 관리되지 않습니다.
              </span>
            </div>

            <div
              className="animate-slideInUp"
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                animationDelay: '0.2s',
              }}
            >
              <Link href="/evaluate" className="btn btn-primary btn-lg">
                🚀 자가진단 시작하기
              </Link>
              <Link href="#process" className="btn btn-secondary btn-lg">
                평가 방법 알아보기
              </Link>
            </div>

            {/* Stats */}
            <div
              className="animate-slideInUp"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '2rem',
                marginTop: '4rem',
                animationDelay: '0.3s',
              }}
            >
              {[
                { number: '100점', label: '총 평가 점수' },
                { number: '3개', label: '평가 영역' },
                { number: '30+', label: '평가 지표' },
              ].map((stat, index) => (
                <div key={index} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                    {stat.number}
                  </div>
                  <div style={{ fontSize: '0.9375rem', color: 'var(--gray-500)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: 'var(--background)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--gray-900)' }}>
              평가 영역
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.8 }}>
              공교육 환경에 최적화된 3단계 평가 체계로<br />
              에듀테크 기업의 가치를 종합적으로 분석합니다.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Card 1 */}
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--primary-500)' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--primary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              }}>
                ✅
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                0. 기본 자격 검증
              </h3>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div className="badge badge-info">Pass / Fail</div>
                <div className="badge badge-success">5항목 + 2항목(디바이스형)</div>
              </div>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                법규 준수, 기술 안정성, 윤리 기준, 사용자 안전성 등 기본적인 자격 요건을 검증합니다.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.6rem' }}>●</span> 사업자 등록
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.6rem' }}>●</span> 개인정보 처리방침
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.6rem' }}>●</span> 서비스 가용률
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.6rem' }}>●</span> 교육 윤리 준수
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.6rem' }}>●</span> 데이터 투명성
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--warning)', fontSize: '0.6rem' }}>●</span> 전자파 적합성
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>(디바이스)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--warning)', fontSize: '0.6rem' }}>●</span> 유해물질 규제
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>(디바이스)</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--accent-500)' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--accent-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              }}>
                🏢
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                1. 기업 역량 평가
              </h3>
              <div className="badge badge-success" style={{ marginBottom: '1rem' }}>
                40점 / 100점
              </div>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                재무 안전성, 운영 지속성, 기술 신뢰성을 통해 기업의 기본 역량을 평가합니다.
              </p>
              <ul style={{ listStyle: 'none', color: 'var(--gray-600)', fontSize: '0.9375rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-500)' }}>●</span> 재무 안전성
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-500)' }}>●</span> 운영 지속성
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent-500)' }}>●</span> 기술 신뢰성
                </li>
              </ul>
            </div>

            {/* Card 3 */}
            <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--secondary-500)' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--secondary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                marginBottom: '1.5rem',
              }}>
                🎓
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                2. 공교육 특화 가치
              </h3>
              <div className="badge badge-warning" style={{ marginBottom: '1rem' }}>
                60점 / 100점
              </div>
              <p style={{ color: 'var(--gray-600)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                교육적 가치, 기술적 가치, 사회적 가치를 통해 공교육 도입 적합성을 평가합니다.
              </p>
              <ul style={{ listStyle: 'none', color: 'var(--gray-600)', fontSize: '0.9375rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--secondary-500)' }}>●</span> 교육적 가치
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--secondary-500)' }}>●</span> 기술적 가치
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--secondary-500)' }}>●</span> 사회적 가치
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="section" style={{ background: 'var(--gray-50)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--gray-900)' }}>
              평가 절차
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', maxWidth: '600px', margin: '0 auto' }}>
              간편한 4단계 자가진단으로 귀사의 공교육 도입 준비 상태를 확인하세요.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            position: 'relative',
          }}>
            {[
              {
                step: '01',
                title: '기업 정보 입력',
                description: '기업명, 비즈니스 모델, 기업 단계 등 기본 정보를 입력합니다.',
                icon: '📝',
              },
              {
                step: '02',
                title: '기본 자격 검증',
                description: '법규 준수, 기술 안정성, 윤리 기준 등 필수 요건을 확인합니다.',
                icon: '✔️',
              },
              {
                step: '03',
                title: '상세 평가 진행',
                description: '기업 역량과 공교육 특화 가치를 항목별로 자가 평가합니다.',
                icon: '📊',
              },
              {
                step: '04',
                title: '결과 확인',
                description: '종합 점수와 등급, 항목별 분석 결과를 확인합니다.',
                icon: '🏆',
              },
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--background)',
                  boxShadow: 'var(--shadow-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 1.5rem',
                  position: 'relative',
                }}>
                  {item.icon}
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--primary-500)',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {item.step}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--gray-900)' }}>
                  {item.title}
                </h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grade System Section */}
      <section className="section" style={{ background: 'var(--background)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--gray-900)' }}>
              최종 등급 산정 체계
            </h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--gray-600)', maxWidth: '700px', margin: '0 auto' }}>
              기업별 최종 점수를 기준으로 AAA~D의 10단계로 세분화된 최종 등급을 부여합니다.
            </p>
          </div>

          {/* Grade Zones */}
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* A Zone */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>A 구간</span>
                  <span style={{ marginLeft: '1rem', opacity: 0.9, fontSize: '0.9375rem' }}>85~100점</span>
                </div>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>전반적 요건 충족, 공교육 활용 시 안정성이 높은 기업군</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--gray-200)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden' }}>
                {[
                  { grade: 'AAA', range: '95~100', desc: '매우 높은 수준' },
                  { grade: 'AA', range: '90~95 미만', desc: '높은 수준' },
                  { grade: 'A', range: '85~90 미만', desc: '우수한 수준' },
                ].map((item, idx) => (
                  <div key={item.grade} style={{ padding: '1.25rem', textAlign: 'center', borderRight: idx < 2 ? '1px solid var(--gray-200)' : 'none', background: 'white' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb', marginBottom: '0.5rem' }}>{item.grade}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>{item.range}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* B Zone */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>B 구간</span>
                  <span style={{ marginLeft: '1rem', opacity: 0.9, fontSize: '0.9375rem' }}>65~85점 미만</span>
                </div>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>핵심 요건 대체로 충족, 일부 보완 시 공교육 활용이 가능한 기업군</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--gray-200)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden' }}>
                {[
                  { grade: 'BBB', range: '80~85 미만', desc: '비교적 양호' },
                  { grade: 'BB', range: '70~80 미만', desc: '보통 수준' },
                  { grade: 'B', range: '65~70 미만', desc: '일부 미흡' },
                ].map((item, idx) => (
                  <div key={item.grade} style={{ padding: '1.25rem', textAlign: 'center', borderRight: idx < 2 ? '1px solid var(--gray-200)' : 'none', background: 'white' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginBottom: '0.5rem' }}>{item.grade}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>{item.range}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* C Zone */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>C 구간</span>
                  <span style={{ marginLeft: '1rem', opacity: 0.9, fontSize: '0.9375rem' }}>50~65점 미만</span>
                </div>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>공교육 활용을 위해 보완이 필요한 기업군</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--gray-200)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden' }}>
                {[
                  { grade: 'CCC', range: '60~65 미만', desc: '일부 개선 필요' },
                  { grade: 'CC', range: '55~60 미만', desc: '주요 항목 개선 필요' },
                  { grade: 'C', range: '50~55 미만', desc: '전반적 개선 필요' },
                ].map((item, idx) => (
                  <div key={item.grade} style={{ padding: '1.25rem', textAlign: 'center', borderRight: idx < 2 ? '1px solid var(--gray-200)' : 'none', background: 'white' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706', marginBottom: '0.5rem' }}>{item.grade}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>{item.range}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* D Zone */}
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>D 구간</span>
                  <span style={{ marginLeft: '1rem', opacity: 0.9, fontSize: '0.9375rem' }}>50점 미만</span>
                </div>
                <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>공교육 환경에 적용이 어려운 기업군</span>
              </div>
              <div style={{ border: '1px solid var(--gray-200)', borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem', textAlign: 'center', background: 'white' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', marginBottom: '0.5rem' }}>D</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '0.25rem' }}>&lt; 50</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>낮은 수준</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section gradient-primary" style={{ textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
            지금 바로 자가진단을 시작하세요
          </h2>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: 1.8 }}>
            귀사의 공교육 도입 준비 상태를 확인하고,<br />
            개선이 필요한 영역을 파악하세요.
          </p>
          <Link
            href="/evaluate"
            className="btn btn-lg"
            style={{
              background: 'white',
              color: 'var(--primary-600)',
              fontWeight: 700,
            }}
          >
            🚀 자가진단 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--gray-900)', color: 'var(--gray-400)', padding: '3rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span>
                <span style={{ fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>
                  에듀테크 기업 가치평가
                </span>
              </div>
              <p style={{ fontSize: '0.875rem' }}>
                KERIS 공교육 중심 에듀테크 기업 가치평가 모형 기반
              </p>
            </div>
            <div style={{ fontSize: '0.875rem' }}>
              © 2026 EdTech Valuation. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
